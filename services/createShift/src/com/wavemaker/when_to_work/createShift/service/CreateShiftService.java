package com.wavemaker.when_to_work.createShift.service;


import com.wavemaker.when_to_work.createShift.model.*;
import com.wavemaker.when_to_work.createShift.model.RootRequest;
import com.wavemaker.when_to_work.createShift.model.RootResponse;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.lang.Object;
import org.springframework.util.MultiValueMap;
import feign.*;

public interface CreateShiftService {

  /**
   * 
   * 
    * @param body RequestBody (optional)
    * @param ngrok_skip_browser_warning ngrok-skip-browser-warning (optional)
   * @return RootResponse
   */
  @RequestLine("POST /scheduling/shifts")
  @Headers({
    "Content-Type: application/json",
    "Accept: */*",
    "ngrok-skip-browser-warning: {ngrok_skip_browser_warning}"  })
  RootResponse invoke(RootRequest body, @Param("ngrok_skip_browser_warning") String ngrok_skip_browser_warning);

}
