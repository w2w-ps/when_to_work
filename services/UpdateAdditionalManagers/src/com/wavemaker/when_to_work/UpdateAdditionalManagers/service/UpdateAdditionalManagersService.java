package com.wavemaker.when_to_work.UpdateAdditionalManagers.service;


import com.wavemaker.when_to_work.UpdateAdditionalManagers.model.*;
import com.wavemaker.when_to_work.UpdateAdditionalManagers.model.RootRequest;
import com.wavemaker.when_to_work.UpdateAdditionalManagers.model.RootResponse;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.lang.Object;
import org.springframework.util.MultiValueMap;
import feign.*;

public interface UpdateAdditionalManagersService {

  /**
   * 
   * 
    * @param id  (required)
    * @param body RequestBody (optional)
    * @param Authorization Authorization (optional)
   * @return RootResponse
   */
  @RequestLine("PUT /managers/{id}")
  @Headers({
    "Content-Type: application/json",
    "Accept: */*",
    "Authorization: {Authorization}"  })
  RootResponse invoke(@Param("id") String id, RootRequest body, @Param("Authorization") String Authorization);

}
