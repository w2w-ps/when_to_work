package com.wavemaker.when_to_work.deletePosition.service;


import com.wavemaker.when_to_work.deletePosition.model.*;
import com.wavemaker.when_to_work.deletePosition.model.RootResponse;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.lang.Object;
import org.springframework.util.MultiValueMap;
import feign.*;

public interface DeletePositionService {

  /**
   * 
   * 
    * @param positionId  (required)
    * @param Authorization Authorization (optional)
    * @param companyId companyId (optional)
   * @return RootResponse
   */
  @RequestLine("DELETE /positions/{positionId}?companyId={companyId}")
  @Headers({
    "Content-Type: application/json",
    "Accept: */*",
    "Authorization: {Authorization}"  })
  RootResponse invoke(@Param("positionId") String positionId, @Param("Authorization") String Authorization, @Param("companyId") String companyId);


    /**
     * 
     * 
     * Note, this is equivalent to the other <code>invoke</code> method,
     * but with the query parameters collected into a single Map parameter. This
     * is convenient for services with optional query parameters, especially when
     * used with the {@link InvokeQueryParams} class that allows for
     * building up this map in a fluent style.
     * @param positionId  (required)
     * @param Authorization Authorization (optional)
     * @param queryParams Map of query parameters as name-value pairs
     *   <p>The following elements may be specified in the query map:</p>
     *   <ul>
     *   <li>companyId - companyId (optional)</li>
     *   </ul>
     * @return RootResponse
     */
    @RequestLine("DELETE /positions/{positionId}?companyId={companyId}")
    @Headers({
    "Content-Type: application/json",
    "Accept: */*",
        "Authorization: {Authorization}"    })
    RootResponse invoke
    (@Param("positionId") String positionId, @Param("Authorization") String Authorization, @QueryMap(encoded=true)
    MultiValueMap<String, String> queryParams);

}
